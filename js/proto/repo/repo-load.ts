import { ProtoRepo } from "./repo-types"
import { Proto, fromFileName } from "@fultonjs/common/lib/protomock/proto";
import { join } from "path"

// returns {ast}[]
export interface LoadGRPCDefinitionsOptions {
    dependRepoDirs?: { [name: string]: string }
}
export async function loadGRPCDefinitions(repo: ProtoRepo, files: string[], dir: string, options?: LoadGRPCDefinitionsOptions): Promise<Proto[]> {
    if (!repo) {
        throw new Error("requires repo")
    }
    const { dependRepoDirs } = options || {}
    const grpcDefs: Proto[] = []

    const includes = repo?.includes?.map?.(e => join(dir, e)) || []

    // traverse all dependency, adds their include
    Object.keys(dependRepoDirs || {}).forEach(depName => {
        const depDir = dependRepoDirs?.[depName]
        if (!depDir) {
            throw new Error(`dependency ${depName} of ${repo?.name} dir not set`)
        }
        const dep = repo?.depends?.[depName]
        if (dep?.qualified) {
            includes.push(depDir)
            return
        }
        dep?.includes?.forEach?.(incl => {
            includes.push(join(depDir, incl))
        })
    })

    for (let file of files) {
        const entryFile = join(dir, file)
        const grpcDef = await fromFileName(entryFile, includes)
        grpcDefs.push(grpcDef)
    }
    return grpcDefs
}