import { NextConfig } from 'next';

const config: NextConfig = {
    webpack: (config) => {
        config.module.rules.push({
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
        });
        return config;
    },
};

export default config;
