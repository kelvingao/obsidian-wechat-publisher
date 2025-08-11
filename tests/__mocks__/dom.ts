// Mock DOM APIs for Node.js testing environment
class MockElement {
    tagName: string = '';
    style: any = {
        cssText: '',
        setProperty: jest.fn()
    };
    classList: any = {
        contains: jest.fn(() => false)
    };
    firstElementChild: MockElement | null = null;
    nextElementSibling: MockElement | null = null;
    outerHTML: string = '';
    _html: string = '';

    constructor(html?: string) {
        this._html = html || '<div></div>';
        this.outerHTML = this._html;
    }

    matches(selector: string): boolean {
        return false;
    }
}

class MockDocument {
    body: any;
    _html: string;

    constructor(html: string) {
        this._html = html;
        this.body = {
            firstChild: new MockElement(html)
        };
    }
}

class MockDOMParser {
    parseFromString(html: string, type: string): MockDocument {
        return new MockDocument(html);
    }
}

// @ts-ignore
global.DOMParser = MockDOMParser;

export {};