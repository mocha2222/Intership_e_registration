import type { DropdownChildSettings, FormElement } from '@/types/domain.types';

type DropdownId = string | number;
type AnswerMap = Record<string, unknown>;

// The caller owns this answer object. This helper never sends HTTP requests.
export function useDropdownAnswers(answers: AnswerMap) {
    function findChildNodeById(
        nodes: DropdownChildSettings[] = [],
        id: DropdownId,
    ): DropdownChildSettings | null {
        for (const node of nodes) {
            if (node.id === id) return node;
            const child = findChildNodeById(getNestedNodes(node), id);
            if (child) return child;
        }
        return null;
    }

    function getChildDropdowns(element: FormElement): DropdownChildSettings[] {
        const nodes = element.settings?.childDropdowns;
        return Array.isArray(nodes) ? nodes : [];
    }

    function getNestedNodes(node: DropdownChildSettings): DropdownChildSettings[] {
        return Array.isArray(node.children) ? node.children : [];
    }

    function getDropdownAnswerKey(fieldId: DropdownId, nodeId: DropdownId | null = null): string {
        return nodeId === null ? `el_${fieldId}` : `el_${fieldId}_node_${nodeId}`;
    }

    function getDropdownOtherKey(fieldId: DropdownId, nodeId: DropdownId | null = null): string {
        return `${getDropdownAnswerKey(fieldId, nodeId)}_other`;
    }

    function readAnswer(key: string): string {
        const value = answers[key];
        return typeof value === 'string' ? value.trim() : '';
    }

    function getDropdownSelectedValue(fieldId: DropdownId, nodeId: DropdownId | null = null): string {
        return readAnswer(getDropdownAnswerKey(fieldId, nodeId));
    }

    function getDropdownOtherValue(fieldId: DropdownId, nodeId: DropdownId | null = null): string {
        return readAnswer(getDropdownOtherKey(fieldId, nodeId));
    }

    function isDropdownFillText(element: FormElement, value: string, nodeId: DropdownId | null = null): boolean {
        if (!value) return false;
        const normalized = value.trim().toLowerCase();
        if (normalized === 'other' || normalized === 'option') return true;
        if (nodeId === null) return element.settings?.optionTypes?.[value] === 'filltext';
        const node = findChildNodeById(getChildDropdowns(element), nodeId);
        return node?.optionTypes?.[value] === 'filltext';
    }

    function getDropdownDisplayValue(element: FormElement, nodeId: DropdownId | null = null): string {
        const selected = getDropdownSelectedValue(element.id, nodeId);
        if (!selected) return '';
        const text = getDropdownOtherValue(element.id, nodeId);
        const normalized = selected.toLowerCase();
        if (normalized === 'other' || normalized === 'option') return text || selected;
        if (isDropdownFillText(element, selected, nodeId) && text) return `${selected}: ${text}`;
        return selected;
    }

    function getAvailableOptions(node: DropdownChildSettings, parentValue: string): string[] {
        const mappings = Array.isArray(node.mappings) ? node.mappings : [];
        const mapping = mappings.find(item => item.parent === parentValue);
        return Array.isArray(mapping?.options) ? mapping.options : [];
    }

    function isDropdownTreeIncomplete(element: FormElement): boolean {
        const selected = getDropdownSelectedValue(element.id);
        if (!selected) return true;
        if (isDropdownFillText(element, selected) && !getDropdownOtherValue(element.id)) return true;
        return hasIncompleteDropdownNode(element, getChildDropdowns(element), selected);
    }

    function hasIncompleteDropdownNode(
        element: FormElement,
        nodes: DropdownChildSettings[] = [],
        parentValue = '',
    ): boolean {
        for (const node of nodes) {
            const options = getAvailableOptions(node, parentValue);
            // A branch with no choices for this parent does not need an answer.
            if (options.length === 0) continue;
            const selected = getDropdownSelectedValue(element.id, node.id);
            if (!selected || !options.includes(selected)) return true;
            const needsText = isDropdownFillText(element, selected, node.id);
            if (needsText && !getDropdownOtherValue(element.id, node.id)) return true;
            // Custom text ends this branch; otherwise check the next level.
            if (!needsText && hasIncompleteDropdownNode(element, getNestedNodes(node), selected)) return true;
        }
        return false;
    }

    function collectDropdownTreeValues(
        element: FormElement,
        nodes: DropdownChildSettings[] = [],
        parentValue = '',
    ): string[] {
        const values: string[] = [];
        for (const node of nodes) {
            const selected = getDropdownSelectedValue(element.id, node.id);
            if (!selected || !getAvailableOptions(node, parentValue).includes(selected)) continue;
            values.push(getDropdownDisplayValue(element, node.id));
            if (!isDropdownFillText(element, selected, node.id)) {
                values.push(...collectDropdownTreeValues(element, getNestedNodes(node), selected));
            }
        }
        return values;
    }

    function getDropdownResponseValue(element: FormElement): string {
        const rootValue = getDropdownDisplayValue(element);
        const childValues = collectDropdownTreeValues(element, getChildDropdowns(element), getDropdownSelectedValue(element.id));
        return [rootValue, ...childValues].filter(Boolean).join(' / ');
    }

    function clearDropdownTreeAnswers(fieldId: DropdownId, nodes: DropdownChildSettings[] = []): void {
        for (const node of nodes) {
            answers[getDropdownAnswerKey(fieldId, node.id)] = '';
            answers[getDropdownOtherKey(fieldId, node.id)] = '';
            clearDropdownTreeAnswers(fieldId, getNestedNodes(node));
        }
    }

    return {
        getChildDropdowns,
        getDropdownAnswerKey,
        getDropdownOtherKey,
        getDropdownSelectedValue,
        getDropdownOtherValue,
        isDropdownFillText,
        getDropdownDisplayValue,
        isDropdownTreeIncomplete,
        hasIncompleteDropdownNode,
        getDropdownResponseValue,
        clearDropdownTreeAnswers,
        collectDropdownTreeValues,
    };
}
