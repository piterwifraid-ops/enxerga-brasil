import React, { createContext, useContext, useState } from "react";

export interface UserData {
	cpf: string;
	nome: string;
	nome_mae: string;
	data_nascimento: string;
	sexo: string;
}

interface UserContextType {
	userName: string;
	setUserName: (name: string) => void;
	userData: UserData | null;
	setUserData: (data: UserData | null) => void;
	transactionData: {
		qrCode: string;
		transactionId: string;
	};
	setTransactionData: React.Dispatch<
		React.SetStateAction<{
			qrCode: string;
			transactionId: string;
		}>
	>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [userName, setUserNameState] = useState<string>(() => {
		if (typeof window === "undefined") return "";
		return localStorage.getItem("userName") ?? "";
	});
	const [userData, setUserDataState] = useState<UserData | null>(() => {
		if (typeof window === "undefined") return null;
		const stored = localStorage.getItem("userData");
		return stored ? JSON.parse(stored) : null;
	});
	const [transactionData, setTransactionDataState] = useState(
		localStorage.getItem("transactionData")
			? JSON.parse(localStorage.getItem("transactionData")!)
			: {
					qrCode: "",
					transactionId: "",
			  },
	);

	return (
		<UserContext.Provider
			value={{
				userName,
				setUserName: (name: string) => {
					if (typeof window !== "undefined") {
						localStorage.setItem("userName", name);
					}
					setUserNameState(name);
				},
				userData,
				setUserData: (data: UserData | null) => {
					if (typeof window !== "undefined") {
						if (data) {
							localStorage.setItem("userData", JSON.stringify(data));
						} else {
							localStorage.removeItem("userData");
						}
					}
					setUserDataState(data);
				},
				transactionData,
				setTransactionData: (
					data: React.SetStateAction<{
						qrCode: string;
						transactionId: string;
					}>,
				) => {
					// resolve possible updater function to a concrete value for localStorage
					const resolved =
						typeof data === "function"
							? (data as (prev: { qrCode: string; transactionId: string }) => {
									qrCode: string;
									transactionId: string;
							  })(transactionData)
							: data;
					if (typeof window !== "undefined") {
						localStorage.setItem("transactionData", JSON.stringify(resolved));
					}
					setTransactionDataState(data);
				},
			}}
		>
			{children}
		</UserContext.Provider>
	);
};

export const useUser = () => {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
};
