
export interface Annotation {
  id: string;
  text: string;
  position: [number, number];
  createdAt: Date;
  type: 'note' | 'warning' | 'info';
}

export function saveAnnotation(annotation: Annotation): void {
  const savedAnnotations = getSavedAnnotations();
  const existingIndex = savedAnnotations.findIndex(a => a.id === annotation.id);
  
  if (existingIndex >= 0) {
    savedAnnotations[existingIndex] = annotation;
  } else {
    savedAnnotations.push(annotation);
  }
  
  localStorage.setItem('savedAnnotations', JSON.stringify(savedAnnotations));
  window.dispatchEvent(new Event('storage'));
}

export function getSavedAnnotations(): Annotation[] {
  const annotationsJson = localStorage.getItem('savedAnnotations');
  if (!annotationsJson) return [];
  
  try {
    const annotations = JSON.parse(annotationsJson);
    return annotations.map((annotation: any) => ({
      ...annotation,
      createdAt: new Date(annotation.createdAt)
    }));
  } catch (e) {
    console.error('Failed to parse saved annotations', e);
    return [];
  }
}

export function deleteAnnotation(id: string): void {
  const savedAnnotations = getSavedAnnotations();
  const filteredAnnotations = savedAnnotations.filter(a => a.id !== id);
  localStorage.setItem('savedAnnotations', JSON.stringify(filteredAnnotations));
  window.dispatchEvent(new Event('storage'));
}
