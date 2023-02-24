import { ServiceClientConstructor, GrpcObject } from "@grpc/grpc-js";
import { Proto, fromFileName } from "@fultonjs/common/lib/protomock/proto";
import * as grpc from "@grpc/grpc-js";
import { ServiceClient } from "@grpc/grpc-js/build/src/make-client";

// `service` example: "helloworld.Greeter"
export function getServiceClientConstructor(service: string, protos: Proto[]): ServiceClientConstructor {
    const segments = service.split(".")

    // this make take longer than you expect
    for (let proto of protos) {
        const protoFile: GrpcObject = proto.ast
        let obj = protoFile?.[service]
        if (!obj) {
            obj = protoFile
            for (let seg of segments) {
                obj = obj?.[seg]
            }
        }
        if (obj) {
            return obj as ServiceClientConstructor
        }
    }
    throw new Error(`serivce not found:${service}`)
}

export interface CreateClientOptions {
    proxy?: string
}

export function createClient(serviceConstructor: ServiceClientConstructor, address: string, opts?: CreateClientOptions): ServiceClient {
    if (!address) {
        throw new Error("requires address")
    }
    let client: ServiceClient
    if (opts?.proxy) {
        client = new serviceConstructor(opts.proxy, grpc.credentials.createInsecure(), {
            'grpc.http_connect_target': `ipv4:${address}`,
        });
    } else {
        client = new serviceConstructor(address, grpc.credentials.createInsecure());
    }
    return client
}

export interface RequestOptions {
    metadata?: { [key: string]: string }
    timeoutMs?: number
    beforeRequest?: () => void
    afterResponse?: (resp, err: Error | undefined) => void
}
export async function request(client: ServiceClient, method: string, req: any, opts?: RequestOptions) {
    if (!client[method]) {
        client.close()
        throw new Error(`method ${method} not found on`)
    }

    let retResp
    let retErr: Error | undefined = undefined
    // make request
    await new Promise(function (resolve, reject) {
        // create metadata like logid,...
        // "user-agent":"grpc-go/1.26.0"
        // "content-type":"application/grpc+proto"
        // "upstream-service-info":"{\"ServiceId\":1641461138498622496,\"ServiceName\":\"....\",\"ServiceMethod\":\"....NotifyRepay\",\"ServiceVersion\":\"1.0.0\",\"ServiceHost\":\"100.95.111.230\",\"ServicePort\":15000}"
        // "uber-trace-id":"603fedb084e3e81a10a0f8e1a874102d:1af0cca4df68a1b6:256b9690f5da00ba:1"
        // "remote":"100.95.164.227:34040"
        // "micro-from-service":"go.micro.server, go.micro.server"
        // ":authority":"10.12.161.204:15000"
        // "service-method":"PayReadManager.QueryConfirmTime"
        // "Remote":"10.129.103.75:59030"
        const meta = new grpc.Metadata();
        for (let k in (opts?.metadata || {})) {
            meta.add(k, opts?.metadata?.[k] as string);
        }
        // default timeout: 100s
        let realTimeoutMs = opts?.timeoutMs === undefined ? 100 * 1000 : (opts?.timeoutMs > 0 ? opts?.timeoutMs : 0)
        const options: any = {}
        if (realTimeoutMs > 0) {
            options.deadline = new Date(Date.now() + realTimeoutMs)
        }
        // interceptor
        if (opts?.beforeRequest) {
            opts?.beforeRequest?.()
        }
        client[method](req, meta, options, (err: Error, resp) => {
            opts?.afterResponse?.(resp, err)
            if (err) {
                reject(err)
                return
            }
            resolve(resp)
        })
    }).then(e => retResp = e).catch(e => retErr = e)
    if (retErr) {
        throw retErr
    }
    return retResp
}