import { Request, Response, NextFunction } from "express";
import { verifyMessage } from "ethers";
import session from "express-session";

/**
 * Verify that a wallet signature is valid for a given message
 * @param message The original message that was signed
 * @param signature The signature from the wallet
 * @param expectedAddress The wallet address that should have signed
 * @returns True if signature is valid
 */
export function verifyWalletSignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recoveredAddress = verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

/**
 * Generate a standardized challenge message for wallet authentication
 * @param walletAddress The wallet address to include in the message
 * @param nonce A unique nonce/timestamp to prevent replay attacks
 * @returns The challenge message to be signed
 */
export function generateAuthMessage(walletAddress: string, nonce: string): string {
  return `Welcome to BNBPOT!\n\nPlease sign this message to verify your wallet ownership.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
}

/**
 * Middleware to ensure user is authenticated via wallet signature
 * Checks if the session has an authenticated wallet address
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.walletAddress) {
    return res.status(401).json({ 
      message: "Authentication required. Please connect and verify your wallet." 
    });
  }
  next();
}

/**
 * Middleware to ensure authenticated user has agreed to terms
 * Must be used after requireAuth
 */
export function requireTermsAgreement(req: Request, res: Response, next: NextFunction) {
  if (!req.session.agreedToTerms) {
    return res.status(403).json({ 
      message: "You must agree to the terms and conditions." 
    });
  }
  next();
}

/**
 * Middleware to ensure authenticated user has admin role
 * Must be used after requireAuth
 */
export function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  if (!req.session.isAdmin) {
    return res.status(403).json({ 
      message: "Admin access required. Only administrators can perform this action." 
    });
  }
  next();
}

// Extend Express session type to include our custom properties
declare module "express-session" {
  interface SessionData {
    walletAddress?: string;
    username?: string;
    agreedToTerms?: boolean;
    isAdmin?: boolean;
    pendingNonce?: string;
    pendingWallet?: string;
  }
}
