(() => {
    if (!window || !window.ocrReimagine) {
        return;
    }

    // Selectors
    SELECTORS = {
        XF: '.experiencefragment',
        SKU: "[data-component-id='29d382aad0139a094d341ff4dd652cd5']",
        BUTTON_OR_ANCHOR: "a,button",
        SKU_BUTTON: ".sku__buttons",
        SKU_TITLE: ".sku__title .oc-product-title",
        PRICE_CONFIG: "data-ocr-pricing-config"
    };

    // Telemetry attributes
    TELEMETRY_ATTRIBUTES = {
        HEADER_NAME: "data-bi-hn",
        EN_HEADER_NAME: "data-bi-ehn",
        DATA_BI_PRODNAME : "data-bi-prod",
        DATA_BI_SKU :"data-bi-sku",
        DATA_BI_SKUNAME : "data-bi-subnm",
        DATA_BI_PRODID : "data-bi-pid",
        DATA_BI_AREANAME: 'data-bi-an',
        DATA_BI_CONTAINERNAME: "data-bi-view"
    };

    TELEMETRY_BEHAVIOR = {
        ACTION_ADD_TO_CART: '81',
        ACTION_EMAIL: '124',
        ACTION_TRIAL_INITIATE: '201'
    };

    window.ocrReimagine.SkuTelemetry = new class {
        /**
         * Adjust telemetry attributes to action components for ESI.
         * Called from sku-default-template.html
         */
        adjustActionTelemetryESI (targetSku) {
            if (!targetSku) return;
            // Add telemetry tags to action component link or button.
            const priceConfigAttributeValue = targetSku.nextElementSibling?.getAttribute(SELECTORS.PRICE_CONFIG);
            if(!priceConfigAttributeValue) {
                return;
            }
            const priceConfig = JSON.parse(priceConfigAttributeValue);
            if(!priceConfig) {
                return;
            }
            const ACTION_LINKS = targetSku.querySelector(SELECTORS.SKU_BUTTON)?.querySelectorAll(SELECTORS.BUTTON_OR_ANCHOR);
            if (ACTION_LINKS === null || ACTION_LINKS.length === 0) 
                return;
            const SKU_TITLE = targetSku.querySelector(SELECTORS.SKU_TITLE)?.textContent;
            const xfContainerElement = findXFIfExists(targetSku);
            ACTION_LINKS.forEach((actionLink) => {
                if (xfContainerElement) {
                    setAreaTags(actionLink, xfContainerElement);
                }
                if (actionLink.dataset.biBhvr == TELEMETRY_BEHAVIOR.ACTION_ADD_TO_CART 
                    || actionLink.dataset.biBhvr == TELEMETRY_BEHAVIOR.ACTION_EMAIL 
                    || actionLink.dataset.biBhvr == TELEMETRY_BEHAVIOR.ACTION_TRIAL_INITIATE) {
                    if (SKU_TITLE) {
                        actionLink.setAttribute(TELEMETRY_ATTRIBUTES.HEADER_NAME, SKU_TITLE);
                        actionLink.setAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_PRODNAME, SKU_TITLE);
                        actionLink.setAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_SKUNAME, SKU_TITLE);
                    }
                }
            });
        };

        // Adjust telemetry attributes to action components for AJAX mode
        // Called from product-pricing script
        adjustActionTelemetryAjax(renderElement, priceResponse) {
            if (!renderElement || !priceResponse) return;
            
            const SKU_TITLE = renderElement.querySelector(SELECTORS.SKU_TITLE)?.textContent;
            var pid = priceResponse.productId;
            var skuId = priceResponse.sku?.id;
            var skuName = priceResponse.sku?.title;
            var ACTION_LINKS = renderElement.querySelector(SELECTORS.SKU_BUTTON)?.querySelectorAll(SELECTORS.BUTTON_OR_ANCHOR);
            if (ACTION_LINKS === null || ACTION_LINKS.length === 0)
                return;
            const xfContainerElement = findXFIfExists(renderElement);
            ACTION_LINKS.forEach((actionLink) => {
                if (xfContainerElement) {
                    setAreaTags(actionLink, xfContainerElement);
                }
                if (actionLink.dataset.biBhvr == TELEMETRY_BEHAVIOR.ACTION_ADD_TO_CART 
                    || actionLink.dataset.biBhvr == TELEMETRY_BEHAVIOR.ACTION_EMAIL 
                    || actionLink.dataset.biBhvr == TELEMETRY_BEHAVIOR.ACTION_TRIAL_INITIATE) {
                    if (SKU_TITLE) {
                        actionLink.setAttribute(TELEMETRY_ATTRIBUTES.HEADER_NAME, SKU_TITLE);
                        actionLink.setAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_PRODNAME, SKU_TITLE);
                    }
                    if (pid) {
                        actionLink.setAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_PRODID, pid);
                    }
                    if (skuId) {
                        actionLink.setAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_SKU, skuId);
                    }
                    if (skuName) {
                        actionLink.setAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_SKUNAME, skuName);
                    }
                }
            });
        }
    };

    // Add telemetry to the page when the DOM is ready.
    document.addEventListener("OnSkuEsiRenderComplete", (e) => {
        window.ocrReimagine.SkuTelemetry.adjustActionTelemetryESI(e.detail.targetSku);
    });

    // process XF area tags for sku buttons
    function processXFArea() {
        const XFs = document.querySelectorAll(SELECTORS.XF);
        if (XFs.length === 0) return;
        XFs.forEach(experienceFragment => {
            const actionInsideSku = experienceFragment.querySelector(SELECTORS.SKU_BUTTON)?.querySelectorAll(SELECTORS.BUTTON_OR_ANCHOR);
            if (!actionInsideSku || actionInsideSku.length === 0) return;
            actionInsideSku.forEach(link => {
                setAreaTags(link, experienceFragment);
            })
        })
    }

    // Set area tags for sku buttons
    function setAreaTags(link, experienceFragment) {
        const tabPillBarItemId = findTabPillBar(experienceFragment.parentElement);
        if (!tabPillBarItemId) return;
        const tabPillBarItem = document.getElementById(tabPillBarItemId + '-tab');
        if (!tabPillBarItem) return;
		if (tabPillBarItem.dataset?.biAn) {
			link.setAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_AREANAME, tabPillBarItem.dataset.biAn);
		} else {
            link.removeAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_AREANAME);
        }
		if (tabPillBarItem.dataset?.biView) {
			link.setAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_CONTAINERNAME, tabPillBarItem.dataset.biView);
		} else {
            link.removeAttribute(TELEMETRY_ATTRIBUTES.DATA_BI_CONTAINERNAME);
        }
    }

    // Find the tab pill bar in the DOM tree with parent element traversal
    function findTabPillBar(currentElement) {
		if (!currentElement) return null;
        if (currentElement.className && currentElement.className === 'root responsivegrid') return;
        if (currentElement.id && currentElement.id.indexOf('tabs-pill-bar') > -1) {
            return currentElement.id;
        }
        return findTabPillBar(currentElement.parentElement);
    }

    // Find if a parent experience fragment exists in the DOM tree
    function findXFIfExists(currentElement) {
        if (currentElement.className && currentElement.className === 'root responsivegrid') return;
        if (currentElement.className && currentElement.className === 'experiencefragment') {
            return currentElement;
        }
        return findXFIfExists(currentElement.parentElement);
    }

    $(document).ready(function () {
        processXFArea();
    });

})();