type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

const detectedProviders = new Map<string, EIP6963ProviderDetail>();

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", ((event: CustomEvent) => {
    const detail = event.detail as EIP6963ProviderDetail;
    if (detail?.info?.rdns) {
      detectedProviders.set(detail.info.rdns, detail);
    }
  }) as EventListener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function getMetaMaskProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;

  window.dispatchEvent(new Event("eip6963:requestProvider"));

  const mm = detectedProviders.get("io.metamask");
  if (mm) return mm.provider;

  const eth = (window as any).ethereum;
  if (!eth) return null;

  if (Array.isArray(eth.providers)) {
    const mmInArray = eth.providers.find((p: any) => p?.isMetaMask && !p?.isPhantom && !p?.isBraveWallet);
    if (mmInArray) return mmInArray as EIP1193Provider;
  }

  if (eth.isMetaMask && !eth.isPhantom) return eth as EIP1193Provider;

  return null;
}

export function getEthereumProvider(): EIP1193Provider | null {
  return getMetaMaskProvider() ?? ((typeof window !== "undefined" ? (window as any).ethereum : null) as EIP1193Provider | null);
}
