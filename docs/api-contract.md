Request  : multipart/form-data { photo, name, description, category, vibe, price? }
Response : { jobId: string, status: "queued" }
Response : { jobId, status: "queued"|"processing"|"completed"|"failed", progress: number }
Response : { jobs: [{ jobId, name, createdAt, status }] }
Response : { captions: string[], hashtags: string[], schedule: string, bannerUrl: string, contentIdeas: string[] }
