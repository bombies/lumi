import { Container, Section, Text } from '@react-email/components';
import * as React from 'react';

type Props = {
	label: string;
	data: React.ReactNode;
};

const LabelledContainer: React.FC<Props> = ({ label, data }) => {
	return (
		<Container className="bg-[#0086ff] rounded-xl p-4">
			<Text className="bg-[#e5f3ff] font-bold m-0 text-[#0086ff] w-fit px-2 py-1 rounded-lg mb-2">
				{label}
			</Text>
			<Section className="text-[#e5f3ff]">{data}</Section>
		</Container>
	);
};

export default LabelledContainer;
