import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { Question } from "../question"
import { Session } from "@/session/session"
import DESCRIPTION from "./question.txt"

export const Parameters = Schema.Struct({
  questions: Schema.mutable(Schema.Array(Question.Prompt)).annotate({ description: "Questions to ask" }),
})

type Metadata = {
  answers: ReadonlyArray<Question.Answer>
}

export const QuestionTool = Tool.define<typeof Parameters, Metadata, Question.Service | Session.Service>(
  "question",
  Effect.gen(function* () {
    const question = yield* Question.Service
    const sessions = yield* Session.Service

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context<Metadata>) =>
        Effect.gen(function* () {
          // Walk up the session parent chain to find the root session.
          // When a subagent (or subagent-of-subagent) asks a question,
          // the event must be published with the root session's ID so
          // the user/parent agent sees the question prompt.
          let targetSessionID = ctx.sessionID
          const info = yield* sessions
            .get(ctx.sessionID)
            .pipe(Effect.catchCause(() => Effect.succeed(undefined)))
          if (info) {
            let current = info
            while (current.parentID) {
              targetSessionID = current.parentID
              const parent = yield* sessions
                .get(current.parentID)
                .pipe(Effect.catchCause(() => Effect.succeed(undefined)))
              if (!parent) break
              current = parent
            }
          }

          const answers = yield* question.ask({
            sessionID: targetSessionID,
            questions: params.questions,
            tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
          })

          const formatted = params.questions
            .map((q, i) => `"${q.question}"="${answers[i]?.length ? answers[i].join(", ") : "Unanswered"}"`)
            .join(", ")

          return {
            title: `Asked ${params.questions.length} question${params.questions.length > 1 ? "s" : ""}`,
            output: `User has answered your questions: ${formatted}. You can now continue with the user's answers in mind.`,
            metadata: {
              answers,
            },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
