export interface FhirMedia {
  resourceType: "Media";
  id: string;
  status: "completed";
  type: {
    coding: Array<{ system: string; code: string; display: string }>;
  };
  subject: { reference: string };
  encounter: { reference: string };
  createdDateTime?: string;
  content: {
    contentType: string;
    url: string;
    title?: string;
  };
  note?: Array<{ text: string }>;
}

export interface FhirDocumentReference {
  resourceType: "DocumentReference";
  id: string;
  status: "current";
  subject: { reference: string };
  context?: {
    encounter?: Array<{ reference: string }>;
    related?: Array<{ reference: string }>;
  };
  type?: { text?: string };
  content: Array<{
    attachment: {
      contentType: string;
      url: string;
      title?: string;
      creation?: string;
    };
  }>;
}
