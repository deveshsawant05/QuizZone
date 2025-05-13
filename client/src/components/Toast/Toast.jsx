import React, { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const types = {
  success: {
    icon: CheckCircleIcon,
    className: 'text-green-500 bg-green-50 border-green-200',
  },
  error: {
    icon: ExclamationCircleIcon,
    className: 'text-red-500 bg-red-50 border-red-200',
  },
  info: {
    icon: InformationCircleIcon,
    className: 'text-blue-500 bg-blue-50 border-blue-200',
  },
  warning: {
    icon: ExclamationCircleIcon,
    className: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  },
};

const Toast = ({
  type = 'info',
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  const ToastIcon = types[type]?.icon || InformationCircleIcon;
  
  React.useEffect(() => {
    let timer;
    if (isVisible && autoClose) {
      timer = setTimeout(() => {
        onClose();
      }, duration);
    }
    return () => clearTimeout(timer);
  }, [isVisible, autoClose, duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <Transition
        show={isVisible}
        as={Fragment}
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className={`max-w-sm w-full rounded-lg shadow-lg border ${types[type]?.className}`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ToastIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                {title && <p className="text-sm font-medium">{title}</p>}
                {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default Toast; 