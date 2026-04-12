import { assertAdmin } from "../../utils/admin";
import { startCrossword } from "../../store";

export default defineEventHandler((event) => {
    assertAdmin(event);
    startCrossword();
    return { ok: true };
});
