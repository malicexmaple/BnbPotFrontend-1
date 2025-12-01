import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async getObjectEntityUploadURL(folder: string = "uploads"): Promise<{ url: string; objectPath: string }> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/${folder}/${objectId}`;
    const objectPath = `/objects/${folder}/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    const signedUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });

    return { url: signedUrl, objectPath };
  }

  async getSignedDownloadURL(objectPath: string, ttlSec: number = 3600): Promise<string> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "GET",
      ttlSec,
    });
  }

  async uploadBuffer(buffer: Buffer, folder: string, filename: string, contentType?: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = `${folder}/${filename}`;
    const fullPath = `${privateObjectDir}/${objectId}`;
    const objectPath = `/objects/${objectId}`;
    
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    const signedUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 300,
    });
    
    const response = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
      body: buffer,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
    }
    
    return objectPath;
  }

  async deleteObject(objectPath: string): Promise<void> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);

    const signedUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "DELETE",
      ttlSec: 60,
    });

    const response = await fetch(signedUrl, { method: "DELETE" });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete object: ${response.status}`);
    }
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;

    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }

    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  async streamObject(objectPath: string, res: Response): Promise<void> {
    try {
      const signedUrl = await this.getSignedDownloadURL(objectPath, 60);
      const response = await fetch(signedUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new ObjectNotFoundError();
        }
        throw new Error(`Failed to fetch object: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const contentLength = response.headers.get("content-length");
      
      res.setHeader("Content-Type", contentType);
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");

      if (response.body) {
        const reader = response.body.getReader();
        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          res.write(Buffer.from(value));
          return pump();
        };
        await pump();
      } else {
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        throw error;
      }
      console.error("Error streaming object:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming file" });
      }
    }
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
