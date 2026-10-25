// Archived donation membership code. Inactive; do not import.
// Original source: retired auth, profile, account menu and donation integrations
//
// // AuthProvider.tsx
//   const setSupporter = useCallback(
//     async (months = 1) => {
//       if (session?.user) {
//         const until = await profileService.setSupporter(months);
//         setProfile((prev) => ({ ...prev, supporterUntil: until }));
//         return;
//       }
//
//       const msPerMonth = 30 * 24 * 60 * 60 * 1000;
//       const until =
//         months > 0
//           ? new Date(Date.now() + months * msPerMonth).toISOString()
//           : null;
//
//       setProfile((prev) => {
//         const nextProfile = { ...prev, supporterUntil: until };
//         writeGuestProfile(nextProfile);
//         return nextProfile;
//       });
//     },
//     [session]
//   );
//
//
//
// // profile.ts
// export function isActiveSupporter(supporterUntil: string | null): boolean {
//   if (!supporterUntil) return false;
//   const expirationTime = new Date(supporterUntil).getTime();
//   return !Number.isNaN(expirationTime) && expirationTime > Date.now();
// }
//
//   async setSupporter(months: number): Promise<string | null> {
//     const { data } = await supabase.rpc('set_supporter_status', { months });
//     return typeof data === 'string' ? data : null;
//   }
// };
//
//
// // dataMigration.ts
// async function migrateGuestProfileToCloud(userId: string): Promise<void> {
//   const rawGuestData = localStorage.getItem(GUEST_PROFILE_KEY);
//   if (!rawGuestData) return;
//
//   const guestProfile = safeJSONParse<Partial<Profile>>(rawGuestData, {});
//   const guestName = guestProfile.displayName?.trim();
//   const guestIsSupporter = isActiveSupporter(
//     guestProfile.supporterUntil ?? null
//   );
//
//   const hasCustomName = guestName && guestName !== DEFAULT_USER_NAME;
//   if (!hasCustomName && !guestIsSupporter) return;
//
//   const remoteProfile = await profileService.get(userId);
//   if (!remoteProfile) return;
//
//   const isCloudProfileBrandNew =
//     remoteProfile.displayName === DEFAULT_USER_NAME &&
//     !remoteProfile.supporterUntil;
//   if (!isCloudProfileBrandNew) return;
//
//   if (hasCustomName) {
//     await profileService.updateDisplayName(userId, guestName);
//   }
//
//   if (guestIsSupporter && guestProfile.supporterUntil) {
//     const timeRemainingMs =
//       new Date(guestProfile.supporterUntil).getTime() - Date.now();
//     const monthsRemaining = Math.max(
//       1,
//       Math.ceil(timeRemainingMs / MS_PER_MONTH)
//     );
//     await profileService.setSupporter(monthsRemaining);
//   }
// }
//
//
//
// // AccountSectionParts.tsx
// function MembershipRow({ tier }: { tier: MembershipTier }) {
//   return (
//     <div className="flex flex-row items-center justify-between gap-2 px-5 py-3.5">
//       <span className="flex items-center gap-2 text-sm text-text-secondary">
//         <Heart className="h-4 w-4 text-text-muted" aria-hidden="true" />
//         Membership
//       </span>
//       <MembershipBadge tier={tier} />
//     </div>
//   );
// }
//
//
// // NavbarMenu.tsx
//         {membershipTier.id !== 'none' && (
//           <MembershipBadge tier={membershipTier} variant="plain" />
//         )}
//
//
// // DonateSection.tsx
//       <InfoCard title="Sponsor badge">
//         <p>
//           Supporting us financially does not unlock some hidden premium feature
//           — every feature is already completely free for everyone. If you
//           donate, it is simply because you find the project useful.
//         </p>
//         <p>
//           That said, to not leave your support unacknowledged, we add a 1-month
//           Sponsor Badge to your account. There are 4 different badge tiers
//           depending on how much you give. Keep in mind this is not a social
//           platform, so no one but you will ever see this badge — it is just our
//           personal, visual way of saying &quot;thank you&quot; when you log in,
//           for helping keep the project running.
//         </p>
//       </InfoCard>
//
