export type WorkExperienceEntry = {
  id: string;
  profileId: string;
  company: string;
  title: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  location: string | null;
  bullets: string[];
};

export type EducationEntry = {
  id: string;
  profileId: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
};

export type SkillCategoryEntry = {
  id: string;
  profileId: string;
  name: string;
  skills: string[];
};
