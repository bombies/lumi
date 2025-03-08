import {
	Body,
	Container,
	Font,
	Head,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components';
import * as React from 'react';

import Title from './title';

type Props = React.PropsWithChildren<{
	preview?: string;
}>;

const EmailTemplate: React.FC<Props> = ({ preview, children }) => {
	return (
		<Html>
			<Head />
			<Font
				fontFamily="Inter"
				fallbackFontFamily="Verdana"
				webFont={{
					url: 'https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2',
					format: 'woff2',
				}}
				fontWeight={400}
				fontStyle="normal"
			/>
			<Font
				fontFamily="Inter"
				fallbackFontFamily="Verdana"
				webFont={{
					url: 'https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2',
					format: 'woff2',
				}}
				fontWeight={600}
				fontStyle="normal"
			/>
			<Font
				fontFamily="Inter"
				fallbackFontFamily="Verdana"
				webFont={{
					url: 'https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2',
					format: 'woff2',
				}}
				fontWeight={700}
				fontStyle="normal"
			/>
			{preview && <Preview>{preview}</Preview>}
			<Tailwind>
				<Body className="bg-[#F8FFF1] my-auto mx-auto font-sans px-2">
					<Container className="bg-[#EBF7DF] border border-solid border-[#2A332210] rounded-lg my-[40px] mx-auto p-[20px] max-w-[465px]">
						<Section className="mt-[32px] mb-[16px] w-full flex justify-center">
							<Title>Lumi</Title>
						</Section>
						{children}
						<hr className="h-[1px] bg-[#2A332210] border-none my-12" />
						<Text className="text-[#2A3322] text-[16px] font-semibold !mb-1 leading-[16px]">
							Lumi
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default EmailTemplate;

export const headingStyle = {
	fontSize: '32px',
	lineHeight: '1.3',
	fontWeight: '900',
	color: '#0086ff',
};

export const subHeadingStyle = {
	...headingStyle,
	fontWeight: 700,
	fontSize: '18px',
};

export const textStyle = {
	color: '#000',
	fontSize: '16px',
};
