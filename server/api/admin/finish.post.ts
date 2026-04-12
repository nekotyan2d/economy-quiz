import { assertAdmin } from "../../utils/admin";
import { finishGame } from "../../store";

export default defineEventHandler((event) => {
    assertAdmin(event);
    finishGame();
    return { ok: true };
});
