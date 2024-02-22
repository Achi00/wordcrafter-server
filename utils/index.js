export const presets = {
  math: {
    temperature: 0.3,
    max_tokens: 1000,
    frequency_penalty: 0.1,
    description:
      "Provide a concise, accurate explanation or solution to a mathematical problem.",
  },
  writing: {
    temperature: 0.9,
    max_tokens: 1000,
    frequency_penalty: 0.1,
    presence_penalty: 0.4,
    description: "Generate a creative and engaging piece of writing.",
  },
  essay: {
    temperature: 0.7,
    max_tokens: 1000,
    frequency_penalty: 0.2,
    presence_penalty: 0.1,
    description: "Generate an informative and structured piece of writing.",
  },

  research: {
    temperature: 0.5,
    max_tokens: 1000,
    frequency_penalty: 0.3,
    presence_penalty: 0.2,
    description:
      "Provide detailed, in-depth information on a specific research topic.",
  },
  default: {
    temperature: 0.5,
    max_tokens: 1000,
    frequency_penalty: 0.6,
    presence_penalty: 0.6,
    description:
      "Generate a concise, factual and informative response suitable for various topics.",
  },
};
