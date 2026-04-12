import { getParticipants } from "../../store";
import { assertAdmin } from "../../utils/admin";

export default defineEventHandler((event) => {
    assertAdmin(event);
    return {
        participants: getParticipants(),
    };
});
