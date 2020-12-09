import React from 'react';
import clsx from 'clsx';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { pluginFeatures, keyFeatures } from './content';
import Heading from '../../Heading';
import './index.scss';
import ImageModal from '../../ImageModal';

const Image = ({ url, className, alt }) => (
    <img className={className ?? ''} src={useBaseUrl(`img/${url}`)} alt={alt} />
);

export default ({ featureType = 'key' }) => {
    const featureConfig = featureType == 'key' ? keyFeatures : pluginFeatures;

    const [imageIndex, setImageIndex] = React.useState(0);
    return (
        <div className="FeatureSection container HomePageSection">
            <Heading
                headingKey={featureConfig.key}
                title={featureConfig.title}
                subtitle={featureConfig.subtitle}
            />
            <div className="Feature-Items">
                <div className="row">
                    <div className="col col--4">
                        {featureConfig.featureItems.map((entry, idx) => (
                            <div
                                key={idx}
                                onClick={() => setImageIndex(idx)}
                                className={clsx(
                                    'feature-item',
                                    imageIndex === idx &&
                                        'feature-item-selected'
                                )}
                            >
                                <div className="feature-item-title">
                                    {entry.title}
                                </div>
                                <div className="feature-item-content">
                                    {entry.content}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="col col--8 feature-item-image">
                        <ImageModal>
                            <Image
                                url={
                                    featureConfig.featureItems[imageIndex].image
                                }
                                className={
                                    featureConfig.featureItems[imageIndex]
                                        .imageClassName
                                }
                                alt={
                                    featureConfig.featureItems[imageIndex].title
                                }
                            />
                        </ImageModal>
                    </div>
                </div>
            </div>
            <div className="text--center">{featureConfig.footer()}</div>
        </div>
    );
};
