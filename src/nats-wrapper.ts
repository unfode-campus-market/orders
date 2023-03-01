import {Stan, connect} from "node-nats-streaming";


class NatsWrapper {
  private _client?: Stan;

  get client() {
    if (!this._client) {
      throw new Error('expected behavior: access NATS client after connecting. actual behavior: access NATS client before connecting.');
    }
    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string): Promise<void> {
    this._client = connect(clusterId, clientId, {url});

    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('Connected to NATS.');
        resolve();
      });
      this.client.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export const natsWrapper = new NatsWrapper();