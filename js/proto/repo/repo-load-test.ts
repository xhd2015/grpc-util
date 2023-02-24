import { loadGRPCDefinitions } from "./repo-load"
import * as path from "path"

export async function test() {
    const protos = await loadGRPCDefinitions({
        name: "test",
    }, ["hello.proto"], path.join(__dirname, "../testdata"), {
    })
    console.log("protos:", protos)
}

test()