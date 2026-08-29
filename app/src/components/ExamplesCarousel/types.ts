export interface SpotlightCardProps {
  example: CodeExample;
}

export interface SpotlightCardHeaderProps {
  title: string;
  description: string;
  format: string;
}

export interface SpotlightCardContentProps {
  input: string;
  output: string;
  command: string;
  language: string;
}

export interface CodeExample {
  title: string;
  description: string;
  format: string;
  command: string;
  input: string;
  output: string;
  language: string;
}
