export async function callAIGraderForMedia({ buffer, type, mimetype }) {
  // TODO: Replace with your actual AI call

  if (type === "video") {
    return {
      analysis: "Video received",
      motion: "Stirring looks smooth and controlled",
      texture: "Consistency appears even throughout the clip",
      technique: "Good utensil control",
      overall: "Great job! Video gives a clear sense of your process.",
    };
  }

  // Default: image
  return {
      analysis: "Image received",
      texture: "Smooth and creamy",
      consistency: "Even, no visible lumps",
      color: "Warm yellow, well-balanced",
      seasoning: "Looks properly salted",
      overall: "Great job! This is a solid mashed potato texture.",
  };
}