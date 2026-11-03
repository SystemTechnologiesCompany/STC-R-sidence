# Service ratings

Apply `migrations/20261103040000_service_ratings.sql` in Supabase SQL Editor, then install the new APK or publish a compatible JavaScript update.

- Each active student can rate all six services in their own residence from 1 to 5.
- Tapping a new value updates that student's existing vote; it does not add another vote.
- The server derives the student's residence from their profile. Clients cannot nominate another residence.
- Service scores are the averages of their students' votes.
- A residence's overall score is the equally weighted average of its rated service scores. Unrated services are excluded, and a residence with no votes displays no rating.
- Example: Restauration averages 4 and Maintenance averages 2; the residence score is 3, regardless of the number of votes in each service.
- Every authenticated account can retrieve overall scores for all residences. Individual votes are not exposed by the summary function. The service breakdown is limited to the caller's own residence.
- Staff and managers can view scores but cannot submit votes.
- Old `residence_ratings` rows remain stored, but are excluded because they cannot be mapped to a specific service.

On Android, verify with two students from one residence and one student from another residence: saved votes should survive signing in on another device, edits should leave the vote count unchanged, and each student must be unable to change the other residence's service scores. Also verify a staff account can read totals but is rejected by the voting RPC.
