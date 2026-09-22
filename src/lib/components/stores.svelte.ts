

export function createCounter() {
    let count = $state("");

    return {
        get count() {
            return count;
        },
        set: (v: string) => (count = v)
    };
}
export const deltaId = createCounter()
// export let deltaId: string = $state("")

export function setDeltaId(id: string): void {
    console.log(`setting id to ${id}` )
    deltaId.set(id)
}
