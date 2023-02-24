import { loadGRPCDefinitions } from "../repo/repo-load"
import * as path from "path"
import { createClient, getServiceClientConstructor, request } from "./client"

// to run this test, you need start server first:
//    node js/proto/testdata/greeter-server.js 
export async function test() {
    const protos = await loadGRPCDefinitions({
        name: "test",
    }, ["hello.proto"], path.resolve(__dirname, "../testdata"), {
    })

    const constructor = getServiceClientConstructor("helloworld.Greeter", protos)
    const client = createClient(constructor, "127.0.0.1:50051")

    const resp = await request(client, "SayHello", { name: "X" })
    console.log("resp:", resp)
    // Output:
    //   resp: { message: 'Hello X' }
}

test()