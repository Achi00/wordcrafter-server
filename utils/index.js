const presets = {
  math: {
    temperature: 0.3,
    max_tokens: 400,
    // other parameters...
  },
  writing: {
    temperature: 0.7,
    max_tokens: 400,
    // other parameters...
  },
  research: {
    temperature: 0.5,
    max_tokens: 800,
    // other parameters...
  },
  startWriting: {
    temperature: 0.8,
    max_tokens: 1500,
    frequency_penalty: 0.2,
    presence_penalty: 0.1,
    // additional parameters as needed
  },
  // Add more presets as needed
};
