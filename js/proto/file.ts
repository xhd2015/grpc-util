import { load as loadDefinition } from '@grpc/proto-loader';
import { loadPackageDefinition } from "@grpc/grpc-js";

export type ProtoLoaderOptions = Parameters<typeof loadDefinition>[1]

const defaultProtoLoaderOptions: ProtoLoaderOptions = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
}

export async function loadProtoFile(file: string, options: ProtoLoaderOptions) {
    // const packageDefinition = loader.loadSync(file, protoLoaderOptions);
    const packageDefinition = await loadDefinition(file, { ...defaultProtoLoaderOptions, ...options });
    return loadPackageDefinition(packageDefinition);
}

