import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { apiFetcher } from '../../utils/fetch';
import { Button } from '../ui/button';
import Loading from '../Loading';
import { RiPrinterFill } from 'react-icons/ri';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

export default function PdfViewer({ open, setOpen, pdfDoc }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [pdfSrc, setPdfSrc] = useState();
  const [pdfComponents, setPdfComponents] = useState(null);
  const [printPluginInstance, setPrintPluginInstance] = useState(null);

  // Dynamically load PDF viewer components
  useEffect(() => {
    const loadPdfComponents = async () => {
      try {
        const [
          { Viewer, Worker },
          { printPlugin }
        ] = await Promise.all([
          import('@react-pdf-viewer/core'),
          import('@react-pdf-viewer/print')
        ]);
        
        const pluginInstance = printPlugin();
        
        setPdfComponents({ Viewer, Worker });
        setPrintPluginInstance(pluginInstance);
      } catch (error) {
        console.error('Failed to load PDF components:', error);
        toast.error(t('Failed to load PDF viewer'));
      }
    };

    if (open) {
      loadPdfComponents();
    }
  }, [open, t]);

  const handleClose = useCallback(() => {
    setPdfSrc();
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    (async () => {
      if (pdfDoc?.url) {
        try {
          const response = await apiFetcher().get(pdfDoc.url, {
            responseType: 'blob'
          });
          setPdfSrc(URL.createObjectURL(response.data));
        } catch (error) {
          handleClose();
          console.error(error);
          toast.error(t('Document not found'));
        }
      }
    })();
  }, [t, pdfDoc, store, handleClose]);

  // Show loading while PDF components are loading or PDF source is loading
  if (open && (!pdfComponents || !printPluginInstance || !pdfSrc)) {
    return <Loading />;
  }

  if (open && pdfSrc && pdfComponents && printPluginInstance) {
    const { Viewer, Worker } = pdfComponents;
    const { Print } = printPluginInstance;
    
    return (
      <Drawer open={open} onOpenChange={setOpen} dismissible={false}>
        <DrawerContent className="w-full h-full p-4">
          <DrawerHeader className="flex items-center px-0">
            <DrawerTitle className="hidden">{pdfDoc.title}</DrawerTitle>
            <div className="text-base md:text-xl font-semibold">
              {pdfDoc.title}
            </div>
            <div className="flex flex-grow justify-end gap-4">
              <Print>
                {(props) => (
                  <Button variant="secondary" onClick={props.onClick}>
                    <RiPrinterFill />
                  </Button>
                )}
              </Print>
              <Button variant="secondary" onClick={handleClose}>
                {t('Close')}
              </Button>
            </div>
          </DrawerHeader>
          <div className="overflow-auto">
            <div className="max-w-4xl md:mx-auto">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.js">
                <Viewer
                  fileUrl={pdfSrc}
                  plugins={[printPluginInstance]}
                  transformGetDocumentParams={(options) =>
                    Object.assign({}, options, {
                      isEvalSupported: false
                    })
                  }
                />
              </Worker>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return null;
}
