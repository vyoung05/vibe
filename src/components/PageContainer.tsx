import React from "react";
import { View, StyleSheet, Platform, ViewProps } from "react-native";

interface PageContainerProps extends ViewProps {
    children: React.ReactNode;
    maxWidth?: number;
}

export const PageContainer: React.FC<PageContainerProps> = ({
    children,
    maxWidth = 1200,
    style,
    ...props
}) => {
    if (Platform.OS !== "web") {
        return (
            <View style={[styles.mobileContainer, style]} {...props}>
                {children}
            </View>
        );
    }

    return (
        <View style={[styles.webOuterContainer, style]} {...props}>
            <View style={[styles.webInnerContainer, { maxWidth }]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mobileContainer: {
        flex: 1,
    },
    webOuterContainer: {
        flex: 1,
        width: "100%",
        alignItems: "center",
    },
    webInnerContainer: {
        width: "100%",
        flex: 1,
    },
});
