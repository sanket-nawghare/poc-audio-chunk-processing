import { AudioSessionMetadata } from "../models/metadata.model";
import { FhirDocumentReference, FhirMedia } from "../models/fhir.model";

export class FhirMapperService {
  toMedia(metadata: AudioSessionMetadata): FhirMedia {
    return {
      resourceType: "Media",
      id: metadata.sessionId,
      status: "completed",
      type: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/media-type",
            code: "audio",
            display: "Audio",
          },
        ],
      },
      subject: { reference: `Patient/${metadata.patientId}` },
      encounter: { reference: `Encounter/${metadata.encounterId}` },
      createdDateTime: metadata.endTime,
      content: {
        contentType: "audio/wav",
        url: metadata.audioUrl,
        title: `Clinical Audio ${metadata.sessionId}`,
      },
      note:
        metadata.aiSignals.length > 0
          ? [{ text: `AI signals: ${metadata.aiSignals.join(", ")}` }]
          : undefined,
    };
  }

  toDocumentReference(metadata: AudioSessionMetadata): FhirDocumentReference {
    return {
      resourceType: "DocumentReference",
      id: metadata.sessionId,
      status: "current",
      subject: { reference: `Patient/${metadata.patientId}` },
      context: {
        encounter: [{ reference: `Encounter/${metadata.encounterId}` }],
        related: metadata.appointmentId
          ? [{ reference: `Appointment/${metadata.appointmentId}` }]
          : undefined,
      },
      type: { text: "Clinical Audio Recording" },
      content: [
        {
          attachment: {
            contentType: "audio/wav",
            url: metadata.audioUrl,
            title: `Session ${metadata.sessionId} audio`,
            creation: metadata.endTime,
          },
        },
      ],
    };
  }
}

export const fhirMapperService = new FhirMapperService();
