// Provider architecture exports
export { selectBestProvider, generateReference } from '@/lib/providers';
export {
  callProvider,
  lemfiAdapter,
  africasTalkingAdapter,
  mfsAfricaAdapter,
  yellowCardAdapter,
  ecobankAdapter,
  vertoAdapter,
  type ProviderInstruction,
  type ProviderResult,
} from './adapters';