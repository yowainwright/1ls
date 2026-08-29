export function parseProtobuf(_input: string): unknown {
  throw new Error(
    "Protobuf parsing requires a .proto schema file. " +
      "Please convert your protobuf to JSON first using protoc: " +
      "protoc --decode_raw < file.pb | 1ls",
  );
}
