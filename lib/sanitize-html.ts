const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'H2', 'H3', 'UL', 'OL', 'LI', 'A']);

export function sanitizeHtml(value: string | null | undefined): string {
    if (!value) return '';
    const source = value.includes('<')
        ? value
        : `<p>${escapeHtml(value).replace(/\r?\n/g, '<br>')}</p>`;
    if (typeof window === 'undefined') {
        return source
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/<!--([\s\S]*?)-->/g, '')
            .replace(/<([a-z0-9]+)(?:\s[^>]*)?>/gi, (match, tag: string) => {
                const upperTag = tag.toUpperCase();
                if (!allowedTags.has(upperTag)) return '';
                if (upperTag !== 'A') return `<${tag.toLowerCase()}>`;
                const href = match.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] || '';
                return /^(https?:|mailto:)/i.test(href) ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">` : '<a>';
            });
    }

    const template = document.createElement('template');
    template.innerHTML = source;
    const nodes = Array.from(template.content.querySelectorAll('*'));
    nodes.forEach((node) => {
        if (!allowedTags.has(node.tagName)) {
            node.replaceWith(document.createTextNode(node.textContent || ''));
            return;
        }
        Array.from(node.attributes).forEach((attribute) => {
            if (node.tagName === 'A' && attribute.name === 'href' && /^(https?:|mailto:)/i.test(attribute.value)) {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
                return;
            }
            node.removeAttribute(attribute.name);
        });
    });
    return template.innerHTML;
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    })[character] || character);
}
