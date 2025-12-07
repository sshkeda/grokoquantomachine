import { Streamdown } from "streamdown";

export function CodeBlock(props: {
  code: string;
  language?: string;
  isAnimating?: boolean;
  controls?: boolean;
}) {
  return (
    <Streamdown
      controls={props.controls ?? true}
      isAnimating={props.isAnimating ?? false}
    >
      {`\`\`\`${props.language ?? ""}\n${props.code}\n\`\`\``}
    </Streamdown>
  );
}
