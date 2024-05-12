
/**
 * Replaces a character at a specific index in a string.
 * @param str - The original string.
 * @param index - The index at which the character should be replaced.
 * @param chr - The character to be inserted at the specified index.
 * @returns The modified string with the character replaced.
 */
function setCharAtStringIndex(str: string, index: number, chr: string) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
}

/**
 * Determines whether a given value is numeric.
 * @param str - The value to be checked.
 * @returns True if the value is numeric, false otherwise.
 */
function isNumeric(str: any) {
    if (typeof str != "string") return false;
    return !isNaN((str as any)) && !isNaN(parseFloat(str))
}

export {
    setCharAtStringIndex,
    isNumeric
}