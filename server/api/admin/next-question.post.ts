import { nextQuestion } from "../../store";
import { assertAdmin } from "../../utils/admin";

export default defineEventHandler((event) => {
    assertAdmin(event);
    nextQuestion();
    return { ok: true };
});
