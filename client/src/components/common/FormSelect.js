import React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const FormSelect = ({
  label,
  id,
  name,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  required = false,
  error = '',
  className = '',
  helpText = '',
  displayProperty = 'label',
  valueProperty = 'value',
}) => {
  const selectedOption = options.find(option => 
    option[valueProperty] === value || 
    (typeof option === 'string' && option === value)
  );

  const handleChange = (selectedItem) => {
    const event = {
      target: {
        name,
        value: typeof selectedItem === 'object' ? selectedItem[valueProperty] : selectedItem
      }
    };
    onChange(event);
  };

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <Listbox value={selectedOption || ''} onChange={handleChange}>
          <div className="relative">
            <Listbox.Button className={`relative w-full cursor-default rounded-lg border ${
              error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500'
            } bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${className}`}>
              <span className={`block truncate ${!selectedOption ? 'text-gray-400' : ''}`}>
                {selectedOption 
                  ? (typeof selectedOption === 'object' ? selectedOption[displayProperty] : selectedOption) 
                  : placeholder}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                      }`
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {typeof option === 'object' ? option[displayProperty] : option}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-primary-600' : 'text-primary-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
        {error && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-8">
            <svg
              className="h-5 w-5 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {helpText && !error && <p className="mt-2 text-sm text-gray-500">{helpText}</p>}
    </div>
  );
};

export default FormSelect;