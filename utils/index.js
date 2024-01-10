export const presets = {
  math: {
    temperature: 0.3,
    max_tokens: 10000,
    frequency_penalty: 0.1,
    description:
      "Provide a concise, accurate explanation or solution to a mathematical problem.",
  },
  writing: {
    temperature: 0.9,
    max_tokens: 10000,
    frequency_penalty: 0.1,
    presence_penalty: 0.4,
    description: "Generate a creative and engaging piece of writing.",
  },
  research: {
    temperature: 0.5,
    max_tokens: 10000,
    frequency_penalty: 0.3,
    presence_penalty: 0.2,
    description:
      "Provide detailed, in-depth information on a specific research topic.",
  },
  default: {
    temperature: 0.6,
    max_tokens: 10000,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
    description:
      "Generate a general, well-rounded response suitable for a variety of topics.",
  },
};
