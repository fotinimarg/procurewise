const CustomRadio = ({ id, name, value, checked, onChange, label }) => {
    return (
        <div className={`rounded-xl p-2 shadow-sm flex items-center text-start justify-start  ${checked ? 'bg-[#BFBFBF] text-white' : 'bg-gray-100'
            }`}
            onClick={() => onChange(value)}>
            <input
                type="radio"
                key={id}
                name={name}
                value={value}
                className="hidden peer"
                checked={checked}
                onChange={() => onChange(value)}
            />
            <div
                htmlFor={id}
                className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center peer-checked:border-[#fc814a] peer-checked:bg-white cursor-pointer mr-2"
            >
                <div
                    className={`w-2 h-2 rounded-full ${checked ? 'bg-[#fc814a]' : 'bg-white'
                        }`}
                ></div>
            </div>
            <label htmlFor={id} className="cursor-pointer">
                {label}
            </label>
        </div>
    )
}

export default CustomRadio;