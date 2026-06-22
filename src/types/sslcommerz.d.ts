declare module "sslcommerz-lts" {
  class SSLCommerzPayment {
    constructor(
      store_id: string | undefined,
      store_passwd: string | undefined,
      is_live: boolean,
    );
    init(data: Record<string, unknown>): Promise<any>;
  }
  export = SSLCommerzPayment;
}
