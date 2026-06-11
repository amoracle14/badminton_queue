export const TEAM_PROFILE_FILES = Array.from({ length: 43 }, (_, index) => {
  return `profile-${String(index + 1).padStart(2, "0")}.svg`;
});

export const getTeamProfileSrc = (profileFile?: string | null) => {
  const file = profileFile ?? TEAM_PROFILE_FILES[0];

  return `/profiles/${encodeURIComponent(file)}`;
};

export const getRandomTeamProfile = () => {
  const index = Math.floor(Math.random() * TEAM_PROFILE_FILES.length);

  return TEAM_PROFILE_FILES[index];
};

export const getRandomTeamProfiles = (count: number) => {
  const shuffledProfiles = TEAM_PROFILE_FILES.slice();

  for (let index = shuffledProfiles.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const currentProfile = shuffledProfiles[index];

    shuffledProfiles[index] = shuffledProfiles[swapIndex];
    shuffledProfiles[swapIndex] = currentProfile;
  }

  return Array.from({ length: count }, (_, index) => {
    return shuffledProfiles[index % shuffledProfiles.length];
  });
};
