/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WRN_PODCAST_ENDPOINT?: string;
  readonly VITE_WRN_DIRECTORY_MANIFEST_ENDPOINT?: string;
  readonly VITE_WRN_TRANSLATION_ENDPOINT?: string;
  readonly VITE_WRN_TRANSLATION_ADAPTER_ID?: string;
  readonly VITE_WRN_TRANSLATION_ADAPTER_VERSION?: string;
  readonly VITE_WRN_TRANSLATION_PROVIDER?: string;
}
