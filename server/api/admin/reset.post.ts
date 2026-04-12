import { assertAdmin } from "../../utils/admin";
import { resetGame } from "../../store";

export default defineEventHandler((event) => {
    assertAdmin(event);
    resetGame();
    return { ok: true };
});
