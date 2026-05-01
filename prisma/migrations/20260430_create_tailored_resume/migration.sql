CREATE TABLE "TailoredResume" (
    "id"          TEXT         NOT NULL,
    "resumeText"  TEXT         NOT NULL,
    "jobText"     TEXT         NOT NULL,
    "outputText"  TEXT         NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TailoredResume_pkey" PRIMARY KEY ("id")
);
