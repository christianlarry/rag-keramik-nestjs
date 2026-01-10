export type AppConfig = {
  nodeEnv: string;
  name: string;
  docsUrl: string;
  workingDirectory: string;
  frontendDomain?: string;
  backendDomain: string;
  port: number;
  apiPrefix: string;
};