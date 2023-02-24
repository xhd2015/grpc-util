export interface ProtoRepo {
    name: string
    includes?: string[] // includes search places
    depends?: { [name: string]: ProtoDepency }
    services?: { [service: string]: ProtoService }
}

export interface ProtoDepency {
    name: string
    // a qualified dependency does not use include, 
    // it just points to the file directy it requires
    // like: https://xxx.git.com/path/to/file
    qualified?: boolean

    includes?: string[]
}

export interface ProtoService {
    name: string
    path: string | string[] // path/to/xxx.proto
}
