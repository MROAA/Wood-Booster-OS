/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Developer Workflow State Machine
 *
 * Hallitsee kehitystehtävän elinkaarta.
 */

class DeveloperWorkflowState {

    constructor({
        logger = console,
    } = {}) {

        this.logger = logger

        this.state = "PENDING"

        this.history = []

    }


    transition(nextState, metadata = {}) {


        const allowed = {

            PENDING: [
                "ANALYZING"
            ],

            ANALYZING: [
                "PLANNING"
            ],

            PLANNING: [
                "WAITING_APPROVAL"
            ],

            WAITING_APPROVAL: [
                "EXECUTING"
            ],

            EXECUTING: [
                "TESTING"
            ],

            TESTING: [
                "COMMITTING",
                "FAILED"
            ],

            COMMITTING: [
                "COMPLETED",
                "FAILED"
            ],

            FAILED: [
                "PENDING"
            ],

            COMPLETED: []

        }


        if (
            !allowed[this.state]
                ?.includes(nextState)
        ) {

            throw new Error(
                `Invalid transition ${this.state} -> ${nextState}`
            )

        }


        const event = {

            from:
                this.state,

            to:
                nextState,

            timestamp:
                new Date().toISOString(),

            metadata,

        }


        this.history.push(event)

        this.state = nextState


        this.logger.info?.(
            `Workflow state: ${this.state}`
        )


        return this.state

    }


    current() {

        return this.state

    }


    snapshot() {

        return {

            state:
                this.state,

            history:
                this.history,

        }

    }

}


export default DeveloperWorkflowState
