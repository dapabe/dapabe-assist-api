import type { Socket } from "node:dgram";
import type UdpSocket from "react-native-udp/lib/types/UdpSocket";

import type {
  ISocketAdapter,
  ISocketIncomingMessage,
} from "../types/socket-adapter";

export abstract class SocketAdapter<T = UdpSocket | Socket>
  implements ISocketAdapter
{
  protected sk!: T;
  /**
   *  Max UDP safe packet size
   * @link https://nodejs.org/api/dgram.html#note-about-udp-datagram-size
   *
   *  After thought: I didnt take into account MTU for Ethernet in mobile
   */
  private readonly MAX_PACKET_SIZE = 576;
  private static readonly PORT_RANGE = {
    MIN: 42000,
    MAX: 42100,
  };
  currentPort!: number;
  currentAddress!: string;

  private getNextPort(): number {
    const nextPort = this.currentPort + 1;
    if (nextPort > SocketAdapter.PORT_RANGE.MAX) {
      return SocketAdapter.PORT_RANGE.MIN;
    }
    return nextPort;
  }
  private rebindPort(): void {
    console.log(`[SocketAdapter] Port ${this.currentPort} in use, re-trying`);
    //@ts-ignore
    this.sk.close(() => {
      this.currentPort = this.getNextPort();
      setTimeout(() => {
        //@ts-ignore
        this.sk.bind(this.currentPort, this.currentAddress);
      }, 1000);
    });
  }

  protected handleErrors(err: Error): void {
    if (err.message.includes("EADDRINUSE")) {
      console.log(`[SocketAdapter] Adress in use: ${err.message}`);
      return this.rebindPort();
    }

    console.log(`[SocketAdapter] Unhandled Error: ${err}`);
    this.close();
  }

  protected afterListeningRef!: () => void;

  isRunning() {
    return !!this.sk;
  }

  addAfterListening(cb: () => void): void {
    this.afterListeningRef = cb;
  }

  protected triggerOnListening(): void {
    //@ts-ignore
    this.currentAddress = this.sk.address().address;
    //@ts-ignore
    this.currentPort = this.sk.address().port;

    //@ts-ignore
    this.afterListeningRef();
    console.log(
      `[SocketAdapter] Binded to ${this.currentAddress}:${this.currentPort}`
    );
  }

  abstract init: (
    port: number,
    address: string,
    parser: ISocketIncomingMessage
  ) => void;

  sendTo(port: number, address: string, data: Buffer<ArrayBuffer>): void {
    if (!this.isRunning()) throw new Error("adapter.notInitialized");
    // if (data.length > this.MAX_PACKET_SIZE) throw new Error('udp.tooLarge');
    //@ts-ignore
    this.sk.send(data, 0, data.length, port, address);
  }

  close(): void {
    if (!this.isRunning()) throw new Error("adapter.notInitialized");
    //@ts-ignore
    this.sk.close(() => {
      //@ts-ignore
      this.sk.removeAllListeners();
      this.sk = undefined!;
    });
  }
}
